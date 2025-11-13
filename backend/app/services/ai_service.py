"""
AI Service for File Sensitivity Analysis
Automatically tags files and recommends encryption levels
"""
import re
import os
from pathlib import Path

class AIService:
    """Simple AI service for auto-tagging and encryption recommendation"""
    
    def __init__(self):
        # Sensitivity keywords and their weights
        self.sensitivity_keywords = {
            # High Sensitivity
            'confidential': 90,
            'secret': 85,
            'classified': 95,
            'password': 80,
            'private': 75,
            'ssn': 90,
            'credit card': 85,
            'bank': 85,
            'financial': 70,
            'medical': 75,
            'legal': 70,
            'contract': 75,
            # Medium Sensitivity
            'personal': 60,
            'internal': 50,
            'salary': 65,
            'budget': 55,
            'report': 40,
            # Low Sensitivity
            'public': 10,
            'general': 15,
            'marketing': 20,
        }
        # File extension risks
        self.file_type_risk = {
            '.pdf': 70, '.doc': 60, '.docx': 60, '.xls': 65, '.xlsx': 65,
            '.sql': 70, '.db': 80, '.key': 95, '.pem': 95,
            '.txt': 30, '.csv': 45, '.json': 40,
            '.jpg': 20, '.png': 20, '.mp4': 10,
            'default': 30
        }
        # Tag mapping based on keywords
        self.tag_mapping = {
            'Confidential': ['confidential', 'secret', 'classified', 'private'],
            'Financial': ['financial', 'bank', 'credit', 'salary', 'budget'],
            'Legal': ['legal', 'contract', 'agreement', 'nda'],
            'Medical': ['medical', 'health', 'patient', 'diagnosis'],
            'Internal': ['internal', 'employee', 'staff', 'team'],
            'Personal': ['personal', 'private'],
            'Public': ['public', 'general', 'marketing']
        }
        # Load spaCy NLP model for entity detection
        try:
            import spacy
            self.nlp = spacy.load("en_core_web_sm")
        except Exception as e:
            self.nlp = None
            print(f"spaCy model not loaded: {e}")
    
    def analyze_filename(self, filename: str) -> dict:
        """
        Analyze filename and recommend encryption settings
        
        Returns:
            dict: {
                'sensitivity_score': int (0-100),
                'recommended_aes': 'AES-128' or 'AES-256',
                'tag': str,
                'reason': str
            }
        """
        filename_lower = filename.lower()
        file_ext = Path(filename).suffix.lower()
        
        # Calculate sensitivity score
        score = 0
        matched_keywords = []
        
        # Check keywords in filename
        for keyword, weight in self.sensitivity_keywords.items():
            if keyword in filename_lower:
                score += weight
                matched_keywords.append(keyword)
        
        # Add file extension risk
        ext_risk = self.file_type_risk.get(file_ext, self.file_type_risk['default'])
        score += ext_risk
        
        # Cap at 100
        score = min(score, 100)
        
        # Determine tag
        tag = self._determine_tag(filename_lower, matched_keywords)
        
        # Recommend AES level
        if score >= 60:
            recommended_aes = 'AES-256'
            reason = 'High sensitivity detected'
        elif score >= 35:
            recommended_aes = 'AES-256'
            reason = 'Medium sensitivity - using AES-256 for safety'
        else:
            recommended_aes = 'AES-128'
            reason = 'Low sensitivity detected'
        
        return {
            'sensitivity_score': score,
            'recommended_aes': recommended_aes,
            'tag': tag,
            'reason': reason,
            'matched_keywords': matched_keywords
        }
    
    def _determine_tag(self, filename_lower: str, matched_keywords: list) -> str:
        """Determine best tag based on keywords"""
        # Check tag mappings
        for tag, keywords in self.tag_mapping.items():
            for keyword in keywords:
                if keyword in filename_lower or keyword in matched_keywords:
                    return tag
        
        # Default tag
        return 'General'
    
    def analyze_content(self, file_path: str) -> dict:
        """
        Analyze file content for sensitive data (for text files)
        Uses spaCy NLP for entity detection in addition to keyword and pattern matching.
        Returns similar dict as analyze_filename
        """
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(10000)  # Read first 10KB only
                content_lower = content.lower()
                score = 0
                matched_keywords = []
                # Keyword matching (existing)
                for keyword, weight in self.sensitivity_keywords.items():
                    if keyword in content_lower:
                        count = content_lower.count(keyword)
                        score += min(weight * count, weight * 2)
                        matched_keywords.append(keyword)
                # NLP entity detection
                if self.nlp:
                    doc = self.nlp(content)
                    for ent in doc.ents:
                        if ent.label_ in ["PERSON", "ORG", "GPE", "MONEY"]:
                            score += 20  # Add weight for sensitive entities
                            matched_keywords.append(ent.label_)
                # Pattern matching (existing)
                patterns = {
                    'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
                    'credit_card': r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
                    'api_key': r'[Aa][Pp][Ii]_?[Kk][Ee][Yy]\s*[:=]',
                    'password': r'[Pp]assword\s*[:=]'
                }
                for pattern_name, pattern in patterns.items():
                    if re.search(pattern, content):
                        score += 50
                        matched_keywords.append(pattern_name)
                score = min(score, 100)
                tag = self._determine_tag(content_lower, matched_keywords)
                if score >= 60:
                    recommended_aes = 'AES-256'
                    reason = 'Sensitive content detected'
                elif score >= 35:
                    recommended_aes = 'AES-256'
                    reason = 'Medium sensitivity content'
                else:
                    recommended_aes = 'AES-128'
                    reason = 'Low sensitivity content'
                return {
                    'sensitivity_score': score,
                    'recommended_aes': recommended_aes,
                    'tag': tag,
                    'reason': reason,
                    'matched_keywords': matched_keywords,
                    'content_analyzed': True
                }
        except Exception as e:
            return {'content_analyzed': False, 'error': str(e)}

# Singleton instance
_ai_service = None

def get_ai_service():
    """Get or create AI service instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
