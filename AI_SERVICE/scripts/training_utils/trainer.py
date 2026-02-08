"""
Model training utilities.

Provides generic interfaces for training different types of ML models.
"""
import logging
from typing import List, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split

logger = logging.getLogger(__name__)


def train_isolation_forest(
    feature_matrix: List[List[float]],
    contamination: float = 0.1,
    n_estimators: int = 100,
    random_state: int = 42
) -> IsolationForest:
    """
    Train an Isolation Forest model for anomaly detection.
    
    Args:
        feature_matrix: List of feature vectors
        contamination: Expected proportion of outliers (default: 0.1 = 10%)
        n_estimators: Number of trees in the forest
        random_state: Random seed for reproducibility
    
    Returns:
        Trained IsolationForest model
    """
    logger.info(f"Training Isolation Forest with {len(feature_matrix)} samples...")
    logger.info(f"Parameters: contamination={contamination}, n_estimators={n_estimators}")
    
    model = IsolationForest(
        contamination=contamination,
        n_estimators=n_estimators,
        random_state=random_state,
        n_jobs=-1,  # Use all CPU cores
        verbose=0
    )
    
    model.fit(feature_matrix)
    logger.info("✅ Isolation Forest training complete")
    
    return model


def train_random_forest(
    X_train: pd.DataFrame,
    y_train: np.ndarray,
    params: dict = None
) -> RandomForestClassifier:
    """
    Train a Random Forest classifier.
    
    Args:
        X_train: Training features
        y_train: Training labels
        params: Model hyperparameters (optional)
    
    Returns:
        Trained RandomForestClassifier model
    """
    if params is None:
        params = {
            'n_estimators': 100,
            'max_depth': 10,
            'class_weight': 'balanced',
            'random_state': 42,
            'n_jobs': -1
        }
    
    logger.info(f"Training Random Forest with {len(X_train)} samples...")
    logger.info(f"Parameters: {params}")
    
    model = RandomForestClassifier(**params)
    model.fit(X_train, y_train)
    
    logger.info("✅ Random Forest training complete")
    return model


def split_train_test(
    X: pd.DataFrame,
    y: np.ndarray,
    test_size: float = 0.2,
    random_state: int = 42,
    stratify: bool = True
) -> Tuple[pd.DataFrame, pd.DataFrame, np.ndarray, np.ndarray]:
    """
    Split data into training and test sets.
    
    Args:
        X: Feature matrix
        y: Labels
        test_size: Proportion of data for testing
        random_state: Random seed
        stratify: Whether to stratify split by labels
    
    Returns:
        Tuple of (X_train, X_test, y_train, y_test)
    """
    stratify_param = y if stratify and len(np.unique(y)) > 1 else None
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=stratify_param
    )
    
    logger.info(f"Split complete: {len(X_train)} train, {len(X_test)} test")
    if y is not None:
        logger.info(f"Train labels: {np.bincount(y_train)}")
        logger.info(f"Test labels: {np.bincount(y_test)}")
    
    return X_train, X_test, y_train, y_test
